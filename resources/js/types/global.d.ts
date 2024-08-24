import { AxiosInstance } from 'axios';
import { route as ziggyRoute } from 'ziggy-js';

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    var route: typeof ziggyRoute;

    export interface TForm{
        id: number;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
    }
}
