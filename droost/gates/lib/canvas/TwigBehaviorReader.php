<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

/**
 * Reports the prop behaviour a component's Twig template encodes.
 *
 * A prop schema says a prop EXISTS. It does not say whether the template ever
 * uses it, or whether what it renders is gated behind another prop. Both are
 * ordinary authoring choices and both are invisible from the registry, so the
 * only way to learn them has been to open the twig — which is exactly what an
 * agent driving Canvas through its tools did not do. Two traps follow from
 * that: a prop you set that changes nothing because the template never reads
 * it, and a prop that renders only when some other prop is truthy.
 *
 * This is a SYNTACTIC scan, not a Twig evaluation. It reads `{% if %}` /
 * `{% else %}` / `{% endif %}` nesting and word-boundary prop references; it
 * does not resolve includes, embeds, macros, or expressions. It is therefore
 * advisory — good enough to say "look at this", never good enough to be the
 * basis of a refusal, which is why nothing gates on its output.
 *
 * The branch rule is what makes it worth reading rather than noisy. A prop
 * referenced inside `{% if url %}` AND inside that same block's `{% else %}`
 * renders either way, so it is reported as unconditional with a note, not as
 * "gated by url" — the naive reading, and a wrong one.
 */
final readonly class TwigBehaviorReader {

  /**
   * Maximum template size to scan, in bytes.
   */
  private const int MAX_BYTES = 262144;

  /**
   * Reads one component template.
   *
   * @param string $path
   *   The absolute template path.
   * @param array<int, string> $props
   *   The declared prop names.
   *
   * @return array{available: bool, reason?: string, unused: array<int, string>, conditional: array<string, array<int, string>>, unconditional: array<int, string>, notes: array<int, string>}
   *   The report. When `available` is FALSE a `reason` is set and the lists are
   *   empty — an unreadable template must not read as "this component uses no
   *   props", which is what bare empty lists would say.
   */
  public function read(string $path, array $props): array {
    if ($props === [] || !is_file($path)) {
      return self::unavailable('the component template could not be read');
    }
    $template = @file_get_contents($path, FALSE, NULL, 0, self::MAX_BYTES);
    if (!is_string($template) || $template === '') {
      return self::unavailable('the component template could not be read');
    }

    // Reference paths per prop: each is the list of [if-id, branch] frames the
    // reference sat inside. An empty path means "rendered unconditionally".
    $refs = array_fill_keys($props, []);
    $stack = [];
    $conditions = [];
    $next = 0;

    foreach (self::tags($template) as $tag) {
      $body = $tag['body'];
      if ($tag['control']) {
        if (preg_match('/^\s*if\s+(.+?)\s*$/s', $body, $m) === 1) {
          $next++;
          $conditions[$next] = self::tidy($m[1]);
          // The condition's own text is scanned below with the frame NOT yet
          // pushed: a prop used to gate something is not itself gated by it.
          self::record($refs, $props, $m[1], $stack);
          $stack[] = ['id' => $next, 'branch' => 'if'];
          continue;
        }
        if (preg_match('/^\s*elseif\s+(.+?)\s*$/s', $body, $m) === 1) {
          $frame = array_pop($stack);
          self::record($refs, $props, $m[1], $stack);
          if ($frame !== NULL) {
            $stack[] = ['id' => (int) $frame['id'], 'branch' => 'else'];
          }
          continue;
        }
        if (preg_match('/^\s*else\s*$/', $body) === 1) {
          $frame = array_pop($stack);
          if ($frame !== NULL) {
            $stack[] = ['id' => (int) $frame['id'], 'branch' => 'else'];
          }
          continue;
        }
        if (preg_match('/^\s*endif\s*$/', $body) === 1) {
          array_pop($stack);
          continue;
        }
      }
      self::record($refs, $props, $body, $stack);
    }

    return self::classify($refs, $conditions);
  }

  /**
   * Splits a template into its Twig tags, in source order.
   *
   * @param string $template
   *   The template source.
   *
   * @return array<int, array{body: string, control: bool}>
   *   Each tag's inner text, and whether it was a `{% %}` control tag.
   */
  private static function tags(string $template): array {
    $out = [];
    if (preg_match_all('/\{([{%])(.*?)[%}]\}/s', $template, $matches, PREG_SET_ORDER) === FALSE) {
      return [];
    }
    foreach ($matches as $match) {
      $out[] = ['body' => $match[2], 'control' => $match[1] === '%'];
    }
    return $out;
  }

  /**
   * Records every declared prop referenced in an expression.
   *
   * @param array<string, array<int, array<int, array{id: int, branch: string}>>> $refs
   *   The per-prop reference paths, by reference.
   * @param array<int, string> $props
   *   The declared prop names.
   * @param string $expression
   *   The tag body to scan.
   * @param array<int, array{id: int, branch: string}> $stack
   *   The conditional frames enclosing this expression.
   */
  private static function record(array &$refs, array $props, string $expression, array $stack): void {
    foreach ($props as $prop) {
      if ($prop === '') {
        continue;
      }
      // Word boundaries, so "url" does not match "image_url" — the exact
      // confusion that would report a gate on the wrong prop.
      if (preg_match('/(?<![\w.])' . preg_quote($prop, '/') . '\b/', $expression) === 1) {
        $refs[$prop][] = $stack;
      }
    }
  }

  /**
   * Turns reference paths into the reported verdicts.
   *
   * @param array<string, array<int, array<int, array{id: int, branch: string}>>> $refs
   *   The per-prop reference paths.
   * @param array<int, string> $conditions
   *   The condition source text, keyed by if-id.
   *
   * @return array{available: bool, unused: array<int, string>, conditional: array<string, array<int, string>>, unconditional: array<int, string>, notes: array<int, string>}
   *   The report.
   */
  private static function classify(array $refs, array $conditions): array {
    $unused = [];
    $conditional = [];
    $unconditional = [];
    $notes = [];

    foreach ($refs as $prop => $paths) {
      if ($paths === []) {
        $unused[] = $prop;
        continue;
      }
      foreach ($paths as $path) {
        if ($path === []) {
          $unconditional[] = $prop;
          continue 2;
        }
      }
      // Every reference is inside some conditional. If they cover both sides
      // of the same outermost if, the prop renders either way.
      $branches = [];
      foreach ($paths as $path) {
        $first = $path[0];
        $branches[$first['id']][$first['branch']] = TRUE;
      }
      foreach ($branches as $id => $seen) {
        if (isset($seen['if'], $seen['else'])) {
          $unconditional[] = $prop;
          $notes[] = sprintf(
            '%s renders either way — it appears in both branches of "%s", though the markup around it differs.',
            $prop,
            $conditions[$id] ?? '?',
          );
          continue 2;
        }
      }
      $gates = [];
      foreach ($paths as $path) {
        foreach ($path as $frame) {
          $condition = $conditions[$frame['id']] ?? '?';
          $gates[$frame['branch'] === 'else' ? 'not (' . $condition . ')' : $condition] = TRUE;
        }
      }
      $conditional[$prop] = array_keys($gates);
    }

    sort($unused);
    sort($unconditional);
    ksort($conditional);
    if ($unused !== []) {
      $notes[] = sprintf(
        'Declared but never referenced by the template: %s. Setting these changes nothing rendered.',
        implode(', ', $unused),
      );
    }
    return [
      'available' => TRUE,
      'unused' => $unused,
      'conditional' => $conditional,
      'unconditional' => array_values(array_unique($unconditional)),
      'notes' => $notes,
    ];
  }

  /**
   * The report for a template that could not be scanned.
   *
   * The lists are present and empty rather than absent, so a consumer reading
   * `unused` on an unavailable report gets [] instead of an undefined-key
   * error — but `available` is what decides whether the emptiness means
   * anything.
   *
   * @param string $reason
   *   Why the scan did not run.
   *
   * @return array{available: bool, reason: string, unused: array<int, string>, conditional: array<string, array<int, string>>, unconditional: array<int, string>, notes: array<int, string>}
   *   The unavailable report.
   */
  private static function unavailable(string $reason): array {
    return [
      'available' => FALSE,
      'reason' => $reason,
      'unused' => [],
      'conditional' => [],
      'unconditional' => [],
      'notes' => [],
    ];
  }

  /**
   * Collapses a condition expression to one readable line.
   *
   * @param string $condition
   *   The raw condition source.
   *
   * @return string
   *   The tidied condition.
   */
  private static function tidy(string $condition): string {
    $collapsed = preg_replace('/\s+/', ' ', trim($condition));
    return is_string($collapsed) ? $collapsed : trim($condition);
  }

}
