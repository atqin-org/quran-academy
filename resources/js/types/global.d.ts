import { AxiosInstance } from 'axios';
import { route as ziggyRoute } from 'ziggy-js';

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    var route: typeof ziggyRoute;

    export interface TForm {
        id: number;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
        fields?: TField[];  // Optional: If you want to include fields as part of the form object
    }
    
    export interface TField {
        id: number;
        form_id: number;
        label: string;
        name: string;
        width: number;
        type: string;
        options: string // Assuming options are stored as a JSON string
        table_reference: string | null;
        is_required: boolean;
        is_multiple: boolean;
        order: number | null;
        created_at: string;
        updated_at: string;
        responses?: TFieldResponse[];  // Optional: If you want to include responses as part of the field object
    }
    
    export interface TFieldResponse {
        id: number;
        field_id: number;
        response_id: number;  // Assuming this is linked to a specific response entity
        response_value: string;
        created_at: string;
        updated_at: string;
    }
    
}
