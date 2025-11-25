/**
 * The "direction(s)" that formul8 operates in.
 */
export enum update_dir {
    from_form = 1, // Changes to the form update the state object.
    to_form = 2, // Changes to the state object update the form.
}

/**
 * Default debounce period.
 */
const default_debounce = 0

/**
 * Default events that formul8 recognizes.
 */
const default_events = ["change", "blur", "keydown", "submit", "reset"]

/**
 * Default update direction.
 */
const default_direction = update_dir.from_form | update_dir.to_form

/**
 * Default boolean for whether or not state object changes should automatically
 * call the notify function.
 */
const default_auto_notify = true

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
export const formul8 = (
    form: HTMLFormElement | string,
    options: {
        debounce: number
        events: string[]
        direction: update_dir
        auto_notify: boolean
    } = null,
) => {
    // Input handling.
    if (typeof form === "string") {
        form = document.getElementById(form) as HTMLFormElement
    }

    if (!(form instanceof HTMLElement)) {
        return [null, null]
    }

    // Parse options and defaults.
    const events = options?.events ?? default_events
    const debounce = options?.debounce ?? default_debounce
    const direction = options?.direction ?? default_direction
    const auto_notify = options?.auto_notify ?? default_auto_notify

    // Form name.
    const name = form.name || form.id || fallback_id(form)
    const event_name = name + "-change"

    // Gather inputs and initial values.
    const inputs = gather_inputs(form)
    const internal_values: ValueColl = {}
    gather_values(internal_values, inputs)

    // Directional logic.
    if (direction & update_dir.from_form) {
        let timer_id: number

        for (const event of events) {
            form.addEventListener(event, () => {
                clearTimeout(timer_id)

                timer_id = setTimeout(() => {
                    gather_values(internal_values, inputs)
                    notify(event_name, internal_values)
                }, debounce)
            })
        }
    }

    let values: ValueColl
    if (direction & update_dir.to_form) {
        const notify_fn = auto_notify
            ? () => notify(event_name, internal_values)
            : () => void 0
        values = value_coll_as_proxy(internal_values, inputs, notify_fn)
    } else {
        values = internal_values
    }

    return [values, event_name]
}

/**
 * JSON object of HTML input-like elements.
 */
type InputColl = { [key: string]: HTMLInputElement | InputColl }

const gather_inputs = (element: HTMLElement) => {
    const inputs: InputColl = {}
    const fieldset_elements: NodeListOf<HTMLFieldSetElement> =
        element.querySelectorAll(":scope > fieldset")

    for (const fieldset of fieldset_elements) {
        const name =
            fieldset.name ||
            fieldset.id ||
            (
                fieldset.querySelector(":scope > legend") as HTMLElement
            )?.innerText
                .toLowerCase()
                .replace(" ", "_") ||
            fallback_id(fieldset)

        inputs[name] = gather_inputs(fieldset)
    }

    const input_elements: NodeListOf<HTMLInputElement> =
        element.querySelectorAll(":not(fieldset) :is(input, textarea, select)")

    for (const input of input_elements) {
        const name = input.name || input.id || fallback_id(input)
        inputs[name] = input
    }

    return inputs
}

/**
 * JSON object of values taken from HTML input-like elements.
 */
type ValueColl = { [key: string]: any }

const gather_values = (values: ValueColl, inputs: InputColl) => {
    if (values === void 0) {
        values = {}
    }

    for (const [name, element] of Object.entries(inputs)) {
        if (element instanceof HTMLElement) {
            if (element.type === "checkbox") {
                values[name] = element.checked
            } else if (element.type === "number") {
                values[name] = Number(element.value)
            } else {
                values[name] = element.value
            }
        } else {
            values[name] = gather_values(values[name], element)
        }
    }

    return values
}

const value_coll_as_proxy = (
    values: ValueColl,
    inputs: InputColl,
    notify: () => void,
) => {
    const handler: ProxyHandler<ValueColl> = {
        get(target, key: string) {
            if (target[key]?.constructor === Object) {
                return value_coll_as_proxy(
                    target[key],
                    inputs[key] as ValueColl,
                    notify,
                )
            } else {
                return target[key]
            }
        },
        set(target, key: string, value) {
            if (target[key] === void 0) {
                console.error("No key " + key + " in object: ", target)
                return true
            }
            target[key] = value
            update_input(inputs[key] as HTMLInputElement, value)
            notify()
            return true
        },
    }

    return new Proxy(values, handler)
}

const update_input = (input: HTMLInputElement, value: any) => {
    if (input.type === "checkbox") {
        input.checked = value
    } else {
        input.value = value
    }
}

export const notify = (event_name: string, values: ValueColl) => {
    document.dispatchEvent(new CustomEvent(event_name, { detail: values }))
}

let inc = 0

const fallback_id = (element: Element) => {
    const id = "formul8_" + inc++
    ;(element as HTMLInputElement).name = id
    console.warn('formul8: Using fallback id "' + id + '" for element', element)
    return id
}
