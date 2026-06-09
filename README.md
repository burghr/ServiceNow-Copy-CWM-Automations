# CWM Copy Automations

A ServiceNow widget that copies automation rules from one CWM board to another.

## Features

- **Board selection** - dropdown lists of all accessible CWM boards with space names
- **Automation preview** - shows all automations on each board with human-readable descriptions
- **Bulk copy** - copies all active automations from source to destination in one click
- **Overwrite mode** - optional toggle to delete existing automations on the destination board before copying
- **Automation types supported:**
  - Update automations ("When [field] changes to [value], set [field] to [value]")
  - Notification automations ("When [field] changes, send notification")
  - Email automations ("When [field] changes, send email")
  - Date-based automations ("When [date] arrives, send notification/email")
- **Results summary** - shows count of copied and removed automations with success/error messages

## Installation

1. Import the widget into your ServiceNow instance via the Service Portal Widget Editor
2. Add the widget to a Service Portal page or dashboard

## Usage

1. Select a **source board** from the dropdown
2. Select a **destination board** (must be different from source)
3. Review the automations listed for both boards
4. Optionally check **Overwrite** to remove existing automations on the destination first
5. Click **Copy Automations**

**Warning:** The overwrite option is destructive - it deletes all existing automations on the destination board before copying. Use with caution.

## Files

| File | Purpose |
|---|---|
| `client.js` | AngularJS controller - handles board selection, copy actions, UI state |
| `server.js` | GlideRecord queries to fetch boards/automations and perform the copy |
| `template.html` | Widget HTML template with form layout and automation lists |
| `style.css` | Styling for the form, automation cards, and status indicators |

## Dependencies

- ServiceNow CWM application
- AngularJS (provided by ServiceNow Service Portal)
- Bootstrap (provided by ServiceNow Service Portal)

## Limitations

- Only copies **active**, non-corrupted automations
- Copies automation configuration only (trigger, update, notification settings) - does not copy related records
- Users must have access to both source and destination boards

## Security

Uses `GlideRecordSecure` for board queries to enforce ACL permissions.
