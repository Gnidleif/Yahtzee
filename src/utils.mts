export function show(element: HTMLElement, displayType: string = "block") {
    element.style.display = displayType;
}

export function hide(element: HTMLElement) {
    element.style.display = "none";
}

export function disable(element: HTMLElement) {
    element.setAttribute("disabled", "disabled");
}

export function enable(element: HTMLElement) {
    element.removeAttribute("disabled");
}

export function find(element: HTMLElement, selector: string): HTMLElement {
    return element.querySelector(selector)!;
}