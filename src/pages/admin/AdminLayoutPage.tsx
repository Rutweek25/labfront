import { Outlet } from "react-router-dom";

export const AdminLayoutPage = () => {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
};
