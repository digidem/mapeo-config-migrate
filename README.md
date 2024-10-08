# Mapeo Config Migrator

A command-line tool to transform old Mapeo configuration folders into the new format. This utility converts the old `fields` and `presets` JSON files to the new structure expected by Mapeo.

## Features

- Transforms `fields` JSON files according to the new specification.
- Ensures `presets` JSON files are updated and consistent with the new format.
- Retains `metadata.json` and `icons` folder unchanged.
- Batch processing of all files in the `fields` and `presets` directories.

## Installation

Install the package globally using npm:

```bash
npm install -g mapeo-config-migrate
```

## Usage

After installation, you can use the `mapeo-config-migrate` command in your terminal.

```bash
mapeo-config-migrate <path-to-old-config> [path-to-new-config]
```

- **`<path-to-old-config>`**: (Required) The path to your old Mapeo configuration folder.
- **`[path-to-new-config]`**: (Optional) The path where the new configuration will be created. If not specified, a `new_config` folder will be created inside the old configuration directory.

### Example

```bash
mapeo-config-migrate /path/to/old/config /path/to/new/config
```

## Detailed Explanation

The tool performs the following transformations:

### Fields

- **Rename `key` to `tagKey`**.

- **Convert `type` values**:
  - Replace underscores with camelCase. For example, `select_one` becomes `selectOne`.

- **Rename `placeholder` to `helperText`**.

- **Transform `options` array**:
  - Converts options from an array of strings to an array of objects with `label` and `value`.
  - Example:
    ```json
    "options": ["Option1", "Option2"]
    ```
    Becomes:
    ```json
    "options": [
      { "label": "Option1", "value": "Option1" },
      { "label": "Option2", "value": "Option2" }
    ]
    ```

- **Add `"universal": false` property**:
  - Sets `universal` to `false` for all fields.

### Presets

- **Ensure key ordering**:
  - Reorders keys in presets for consistency.

### Metadata and Icons

- **Retain `metadata.json` and `icons` folder unchanged**.

## Running Tests

To run the test suite and ensure everything works as expected:

```bash
npm test
```

The tests will verify the correctness of the transformations and ensure the script works properly.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE)