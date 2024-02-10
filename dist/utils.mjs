export function show(element, displayType = "block") {
    element.style.display = displayType;
}
export function hide(element) {
    element.style.display = "none";
}
export function disable(element) {
    element.setAttribute("disabled", "disabled");
}
export function enable(element) {
    element.removeAttribute("disabled");
}
export function find(element, selector) {
    return element.querySelector(selector);
}
