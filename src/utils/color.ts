function toHex(i) {
    // @ts-ignore
    return "#" + ("000000" + i.toString(16)).slice(-6)
}

export {toHex}