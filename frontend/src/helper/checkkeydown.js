export const CheckKeyDownEnter = e => {
    if (e.key === "Enter") {
        e.preventDefault();
        return;
    }
};
