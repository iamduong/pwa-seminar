import { AxiosError } from "axios";
import { useCallback, useState } from "react";

const QueryErrorDict: Record<number, string> = {
    0: "Không xác định được lỗi",
    1: "Không thể kết nối tới máy chủ",
    2: "Người dùng chưa đăng nhập hệ thống",
    3: "Phiên đăng nhập hết hạn",
    4: "Không có quyền truy cập vào tài nguyên",
}

export type QueryError = {
    code: number;
    message: string;
}

export const useQuery = () => {
    const [inProcess, setInProcess] = useState<boolean>(false);

    const execute = useCallback(async (
        doQuery: () => void,
        options?: {
            onSuccess?: () => void,
            onError?: (error: QueryError, callback?: string) => void,
        }
    ) => {
        try {
            setInProcess(true);
            await doQuery();
            options?.onSuccess?.();
        } catch (error: unknown) {
            console.log("Catch error in useQuery: ", error);
            let code = 0;
            let message = null;
            // Axios error
            if (error instanceof AxiosError) {
                if (!error.response) {
                    code = 1;   
                }
                else {
                    const response = error.response;
                    if (response.data && response.data.message) {
                        message = response.data.message;
                    }
                }
            }
            else if (error instanceof Error) {
                message = error.message;
            }

            message = message ?? QueryErrorDict[code];

            options?.onError?.({ code, message });
        } finally {
            setInProcess(false);
        }
    }, []);

    return { execute, inProcess };
};

export default useQuery;
