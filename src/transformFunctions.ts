export function transformField(field: any): any {
    const transformedField: any = { ...field };
    if (transformedField.key) {
        transformedField.tagKey = transformedField.key;
        delete transformedField.key;
    }
    if (transformedField.type) {
        transformedField.type = transformedField.type.replace(/_(\w)/g, (match: string, letter: string) => letter.toUpperCase());
    }
    if (transformedField.placeholder) {
        transformedField.helperText = transformedField.placeholder;
        delete transformedField.placeholder;
    }
    if (transformedField.options && Array.isArray(transformedField.options)) {
        transformedField.options = transformedField.options.map((option: string | Record<string, unknown>) => {
            if (typeof option === 'string') {
                return {
                    label: option,
                    value: option
                };
            }
            return option;
        });
    }
    transformedField.universal = false;
    return transformedField;
}

export function transformPreset(preset: any): any {
    const orderedPreset: { [key: string]: any } = {};
    const keyOrder = ["name", "icon", "color", "fields", "geometry", "tags", "terms"];
    for (const key of keyOrder) {
        if (Object.prototype.hasOwnProperty.call(preset, key)) {
            orderedPreset[key] = preset[key];
        }
    }
    for (const key of Object.keys(preset)) {
        if (!Object.prototype.hasOwnProperty.call(orderedPreset, key)) {
            orderedPreset[key] = preset[key];
        }
    }
    // Add additional required properties
    orderedPreset.fieldRefs = [];
    orderedPreset.removeTags = {};
    orderedPreset.addTags = {};

    return orderedPreset;
}
