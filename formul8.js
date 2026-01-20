/**
 * The "direction(s)" that formul8 operates in.
 */
export var update_dir;
(function (update_dir) {
    update_dir[update_dir["from_form"] = 1] = "from_form";
    update_dir[update_dir["to_form"] = 2] = "to_form";
})(update_dir || (update_dir = {}));
/**
 * Default debounce period.
 */
const default_debounce = 0;
/**
 * Default events that formul8 recognizes.
 */
const default_events = ["change", "blur", "keydown", "submit", "reset"];
/**
 * Default update direction.
 */
const default_direction = update_dir.from_form | update_dir.to_form;
/**
 * Default boolean for whether or not state object changes should automatically
 * call the notify function.
 */
const default_auto_notify = true;
/**
 * Builds a JSON object from the given form, where each form input is a key in
 * the object (fieldsets make sub-objects).  The values of the object are
 * updated and a custom event fired on the document each time the form changes,
 * after a debounce period.
 * @param form The form in question, either the HTMLElement or the ID.
 * @param options Debounce is the amount of time in milliseconds after a change
 * when the value object should be updated; Events are the events for which the
 * value object should update; Direction is which direction(s) the form should
 * be updated.
 * @returns The value object that is updated each change, and the name of the
 * event that fires on those updates.  Null and null if the given form doesn't
 * exist.
 */
export const formul8 = (form, options = null) => {
    // Input handling.
    if (typeof form === "string") {
        form = document.getElementById(form);
    }
    if (!(form instanceof HTMLElement)) {
        return [null, null];
    }
    // Parse options and defaults.
    const events = options?.events ?? default_events;
    const debounce = options?.debounce ?? default_debounce;
    const direction = options?.direction ?? default_direction;
    const auto_notify = options?.auto_notify ?? default_auto_notify;
    // Form name.
    const name = form.id || form.name || fallback_id(form);
    const event_name = name + "-change";
    // Gather inputs and initial values.
    const inputs = gather_inputs(form);
    const internal_values = {};
    gather_values(internal_values, inputs);
    // Directional logic.
    if (direction & update_dir.from_form) {
        let timer_id;
        for (const event of events) {
            form.addEventListener(event, () => {
                clearTimeout(timer_id);
                timer_id = setTimeout(() => {
                    gather_values(internal_values, inputs);
                    notify(event_name, internal_values);
                }, debounce);
            });
        }
    }
    let values;
    if (direction & update_dir.to_form) {
        const notify_fn = auto_notify
            ? () => notify(event_name, internal_values)
            : () => void 0;
        values = value_coll_as_proxy(internal_values, inputs, notify_fn);
    }
    else {
        values = internal_values;
    }
    return [values, event_name];
};
const gather_inputs = (element) => {
    const inputs = {};
    const fieldset_elements = element.querySelectorAll("fieldset");
    for (const fieldset of fieldset_elements) {
        const name = fieldset.name ||
            fieldset.id ||
            fieldset.querySelector(":scope > legend")?.innerText
                .toLowerCase()
                .replace(" ", "_") ||
            fallback_id(fieldset);
        inputs[name] = gather_inputs(fieldset);
    }
    const input_elements = element.querySelectorAll(":not(fieldset) :is(input, textarea, select)");
    for (const input of input_elements) {
        const name = input.name || input.id || fallback_id(input);
        inputs[name] = input;
    }
    return inputs;
};
const gather_values = (values, inputs) => {
    if (values === void 0) {
        values = {};
    }
    for (const [name, element] of Object.entries(inputs)) {
        if (element instanceof HTMLElement) {
            if (element.type === "checkbox") {
                values[name] = element.checked;
            }
            else if (element.type === "number") {
                values[name] = Number(element.value);
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
const value_coll_as_proxy = (values, inputs, notify) => {
    const handler = {
        get(target, key) {
            if (target[key]?.constructor === Object) {
                return value_coll_as_proxy(target[key], inputs[key], notify);
            }
            else {
                return target[key];
            }
        },
        set(target, key, value) {
            if (target[key] === void 0) {
                console.error("No key " + key + " in object: ", target);
                return true;
            }
            target[key] = value;
            update_input(inputs[key], value);
            notify();
            return true;
        },
    };
    return new Proxy(values, handler);
};
const update_input = (input, value) => {
    if (input.type === "checkbox") {
        input.checked = value;
    }
    else {
        input.value = value;
    }
};
export const notify = (event_name, values) => {
    document.dispatchEvent(new CustomEvent(event_name, { detail: values }));
};
let inc = 0;
const fallback_id = (element) => {
    const id = "formul8_" + inc++;
    element.name = id;
    console.warn('formul8: Using fallback id "' + id + '" for element', element);
    return id;
};
