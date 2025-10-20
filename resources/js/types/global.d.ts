import { AxiosInstance } from "axios";
import { route as ziggyRoute } from "ziggy-js";
import { PageProps } from ".";

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    interface ProgramDisplay {
        id: number;
        subject_name: string;
        club_name: string;
        category_name: string;
        start_date: string;
        end_date: string;
        days_of_week: string[];
    }

    interface ProgramSession {
        id: number;
        session_date: string;
        start_time: string | null;
        end_time: string | null;
    }

    interface ProgramDisplay {
        id: number;
        subject_name: string;
        club_name: string;
        category_name: string;
        start_date: string;
        end_date: string;
        days_of_week: string[];
        sessions: ProgramSession[];
    }
    interface ProgramsProps extends PageProps {
        programs: { data: ProgramDisplay[]; links: any[] };
    }

    var route: typeof ziggyRoute;
}
