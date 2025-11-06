// ✅ useAuthInit.ts
import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { fetchMe } from "../store/slices/authSlice";

export const useAuthInit = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchMe()); // куки передаются автоматически с withCredentials
    }, []);
};
