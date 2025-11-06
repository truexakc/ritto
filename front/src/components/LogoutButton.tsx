import { useAppDispatch } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";
import { ReactNode } from "react";

interface LogoutButtonProps {
    icon?: ReactNode;
    onLogout?: () => void;
}

const LogoutButton = ({ icon, onLogout }: LogoutButtonProps) => {
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(logoutUser());
        onLogout?.();
    };

    return (
        <button onClick={handleLogout} title="Выйти">
            {icon ?? "Выйти"}
        </button>
    );
};

export default LogoutButton;
