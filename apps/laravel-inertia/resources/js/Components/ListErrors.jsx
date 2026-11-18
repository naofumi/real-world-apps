export default function ListErrors({ errors }) {
    const messages = Object.values(errors || {}).flat().filter(Boolean);
    if (!messages.length) {
        return null;
    }

    return (
        <ul className="error-messages">
            {messages.map((message) => (
                <li key={message}>{message}</li>
            ))}
        </ul>
    );
}
