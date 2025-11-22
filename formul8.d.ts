/**
 * The "direction(s)" that formul8 operates in.
 */
export declare enum update_dir {
    from_form = 1,// Changes to the form update the state object.
    to_form = 2
}
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
export declare const formul8: (form: HTMLFormElement | string, options?: {
    debounce: number;
    events: string[];
    direction: update_dir;
    auto_notify: boolean;
}) => (string | ValueColl)[];
/**
 * JSON object of values taken from HTML input-like elements.
 */
type ValueColl = {
    [key: string]: any;
};
export declare const notify: (event_name: string, values: ValueColl) => void;
export {};
