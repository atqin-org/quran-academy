import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormErrorMessageProps {
    formStateErrors?: FieldError;
    errors?: string;
}

const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ formStateErrors, errors }) => {
    return (
        <>
            {formStateErrors && (
                <span className="text-red-500">
                    {formStateErrors.message}
                </span>
            )}
            {!formStateErrors && errors && (
                <span className="text-red-500">{errors}</span>
            )}
        </>
    );
};

export default FormErrorMessage;
