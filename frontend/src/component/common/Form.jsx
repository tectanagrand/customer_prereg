const Form = ({ children }) => {
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    return <form onKeyDown={checkKeyDown}>{children}</form>;
};

export default Form;
