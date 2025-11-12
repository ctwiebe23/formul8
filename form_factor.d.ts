/**
 * Builds a JSON object from the given form, where each form input is a key in
 * the object (fieldsets make sub-objects).  The values of the object are
 * updated and a custom event fired on the document each time the form changes,
 * after a debounce period.
 * @param form The form in question, either the HTMLElement or the ID.
 * @param debounce The amount of time in milliseconds after which the value
 * object should be updated.
 * @returns The value object that is updated each change, and the name of the
 * event that fires on those updates.  Null and null if the given form doesn't
 * exist.
 */
export declare const form_factor: (form: HTMLFormElement | string, debounce?: number) => {
    values: ValueColl;
    event_name: string;
};
type ValueColl = {
    [key: string]: any;
};
export {};
