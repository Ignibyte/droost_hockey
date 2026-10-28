<?php

/**
 * @file
 * Rung 2's configuration: the contact webform.
 *
 * Rung 2's configuration: the contact webform, its email, its spam trap and
 * who may read what it stores.
 *
 * Webform installs a sample "Contact" webform; this makes it the design's
 * form. Idempotent: run it again and it writes the same webform. Run it with
 *   ddev drush php:script scripts/kch/r02_contact.php
 * The result is exported configuration (config/sync); this script is how it
 * was made, and remakes it on a site that has only the modules.
 */

declare(strict_types=1);

use Drupal\canvas\Entity\Component;
use Drupal\Component\Serialization\Yaml;
use Drupal\user\Entity\Role;
use Drupal\webform\Entity\Webform;

$subjects = ['Camp Inquiry', 'Private Lessons', 'Rink Information', 'Other'];

$elements = [
  'name' => [
    '#type' => 'textfield',
    '#title' => 'Name',
    '#required' => TRUE,
    '#placeholder' => 'Shoresy',
    '#autocomplete' => 'name',
  ],
  'email' => [
    '#type' => 'email',
    '#title' => 'Email',
    '#required' => TRUE,
    '#placeholder' => 'pucks@deep.com',
    '#autocomplete' => 'email',
  ],
  // Keyed by its own label, so /contact?subject=Private Lessons chooses it.
  'subject' => [
    '#type' => 'select',
    '#title' => 'Subject',
    '#options' => array_combine($subjects, $subjects),
    '#required' => TRUE,
    '#default_value' => 'Camp Inquiry',
    '#prepopulate' => TRUE,
  ],
  'message' => [
    '#type' => 'textarea',
    '#title' => 'Message',
    '#required' => TRUE,
    '#rows' => 5,
    '#placeholder' => 'How can we help?',
  ],
  'actions' => [
    '#type' => 'webform_actions',
    '#title' => 'Submit button(s)',
    '#submit__label' => 'Fire Away',
  ],
];

$webform = Webform::load('contact') ?? Webform::create(['id' => 'contact']);
$webform->set('title', 'Contact');
$webform->set('description', 'The /contact page\'s form: each message is kept here and emailed to info@kchockey.com.');
$webform->setElements($elements);
$webform->setSettings([
  // /contact (the Canvas page) is the form's only address.
  'page' => FALSE,
  'form_prepopulate' => FALSE,
  'confirmation_type' => 'inline',
  'confirmation_title' => 'Message Sent!',
  'confirmation_message' => "Thanks for reaching out. We'll get back to you between periods.",
  'confirmation_back' => TRUE,
  'confirmation_back_label' => 'Send Another',
  'form_previous_submissions' => FALSE,
] + $webform->getSettings());

// The spam trap: a hidden field a person never fills, and a time limit a
// person never beats. No puzzle, no checkbox.
$webform->setThirdPartySetting('honeypot', 'honeypot', TRUE);
$webform->setThirdPartySetting('honeypot', 'time_restriction', TRUE);

// Content editors read every stored message.
$access = $webform->getAccessRules();
$access['view_any']['roles'] = ['content_editor'];
$webform->setAccessRules($access);

// One email, to the site's inbox. The sample's confirmation to the visitor
// is dropped: it would mail any address a stranger typed in.
foreach (array_keys($webform->getHandlers()->getConfiguration()) as $handler_id) {
  $webform->deleteWebformHandler($webform->getHandler($handler_id));
}
$manager = \Drupal::service('plugin.manager.webform.handler');
$handler = $manager->createInstance('email', [
  'handler_id' => 'email_notification',
  'label' => 'Email to info@kchockey.com',
  'status' => TRUE,
  'weight' => 0,
  'settings' => [
    'states' => ['completed'],
    'to_mail' => 'info@kchockey.com',
    'from_mail' => '_default',
    'from_name' => '_default',
    'reply_to' => '[webform_submission:values:email:raw]',
    'subject' => 'Contact form: [webform_submission:values:subject:raw] from [webform_submission:values:name:raw]',
    'body' => '_default',
    'html' => FALSE,
  ],
]);
$webform->addWebformHandler($handler);
$webform->save();

// The contact details and the sent panel are placed by the blocks and the
// form, not by editors: kept out of the Canvas library (they still render).
foreach (['sdc.kchockey.contact_info', 'sdc.kchockey.form_sent'] as $component_id) {
  $component = Component::load($component_id);
  if ($component && $component->status()) {
    $component->disable()->save();
  }
}

// Content editors find the form under Structure › Webforms.
$editor = Role::load('content_editor');
$editor->grantPermission('access webform overview');
$editor->save();

print Yaml::encode(['webform' => $webform->id(), 'handlers' => array_keys($webform->getHandlers()->getConfiguration())]);
