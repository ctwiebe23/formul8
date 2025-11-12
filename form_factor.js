const default_debounce = 250;
const notable_events = ["change", "blur", "keydown", "submit"];
/**
 * Builds a JSON object from the given form, where each form input is a key in
 * the object (fieldsets make sub-objects).  The values of the object are
 * updated and a custom event fired on the document each time the form changes,
 * after a debounce period.
 * @param form The form in question, either the HTMLElement or the ID.
 * @param options Debounce is the amount of time in milliseconds after a change
 * when the value object should be updated; Events are the events for which the
 * value object should update.
 * @returns The value object that is updated each change, and the name of the
 * event that fires on those updates.  Null and null if the given form doesn't
 * exist.
 */
export const form_factor = (form, options = null) => {
    if (typeof form === "string") {
        form = document.getElementById(form);
    }
    if (!(form instanceof HTMLFormElement)) {
        return { values: null, event_name: null };
    }
    const events = options?.events || notable_events;
    const debounce = options?.debounce || default_debounce;
    const name = form.name || form.id || fallback_id();
    const event_name = name + "-change";
    const inputs = gather_inputs(form);
    const values = {};
    gather_values(values, inputs);
    let timer_id;
    for (const event of events) {
        form.addEventListener(event, () => {
            clearTimeout(timer_id);
            timer_id = setTimeout(() => {
                gather_values(values, inputs);
                notify(event_name, values);
            }, debounce);
        });
    }
    return { values, event_name };
};
const gather_inputs = (element) => {
    const inputs = {};
    const fieldset_elements = element.querySelectorAll(":scope > fieldset");
    for (const fieldset of fieldset_elements) {
        const name = fieldset.name ||
            fieldset.id ||
            fieldset.querySelector(":scope > legend")
                ?.innerText ||
            fallback_id();
        inputs[name] = gather_inputs(fieldset);
    }
    const input_elements = element.querySelectorAll(":scope > :is(input, textarea, select)");
    for (const input of input_elements) {
        const name = input.name || input.id || fallback_id();
        inputs[name] = input;
    }
    return inputs;
};
const gather_values = (values, inputs) => {
    if (values === undefined) {
        values = {};
    }
    for (const [name, element] of Object.entries(inputs)) {
        if (element instanceof HTMLElement) {
            if (element.type === "checkbox") {
                values[name] = element.checked;
            }
            else {
                values[name] = element.value;
            }
        }
        else {
            values[name] = gather_values(values[name], element);
        }
    }
    return values;
};
const notify = (event_name, values) => {
    document.dispatchEvent(new CustomEvent(event_name, { detail: values }));
};
let inc = 0;
const fallback_id = () => {
    console.warn("Using fallback id: form_factor_" + inc);
    return "form_factor_" + inc++;
};
