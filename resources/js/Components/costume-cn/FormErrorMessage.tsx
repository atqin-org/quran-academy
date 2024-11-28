import React from 'react';
import { FieldError, Merge } from 'react-hook-form';

interface FormErrorMessageProps {
    formStateErrors?: FieldError | Merge<FieldError, (FieldError | undefined)[]> | undefined;
    errors?: string;
}

const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ formStateErrors, errors }) => {
    if (!formStateErrors && !errors) {
        return null;
    }

    const errorMessages = Array.isArray(formStateErrors)
        ? formStateErrors.filter(Boolean).map((error) => error?.message)
        : [formStateErrors?.message];

    return (
        <div className="text-red-600 text-sm mt-1">
            {errorMessages.map((message, index) => (
                <p key={index}>{message}</p>
            ))}
            {errors && <p>{errors}</p>}
        </div>
    );
};

export default FormErrorMessage;
