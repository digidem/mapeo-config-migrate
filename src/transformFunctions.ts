export function transformField(field: any): any {
    if (field.key) {
        field.tagKey = field.key;
        delete field.key;
    }
    if (field.type) {
        field.type = field.type.replace(/_(\w)/g, (match: string, letter: string) => letter.toUpperCase());
    }
    if (field.placeholder) {
        field.helperText = field.placeholder;
        delete field.placeholder;
    }
    if (field.options && Array.isArray(field.options)) {
        field.options = field.options.map((option: string | Record<string, unknown>) => {
            if (typeof option === 'string') {
                return {
                    label: option,
                    value: option
                };
            }
            return option;
        });
    }
    field.universal = false;
    return field;
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
    return orderedPreset;
}
