import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

export function Sidebar() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Orders', href: '/orders' },
    { name: 'Products', href: '/products' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-full flex-col bg-gray-900 w-64 flex-shrink-0">
      <div className="flex h-16 shrink-0 items-center px-6 bg-gray-950">
        <span className="text-xl font-bold text-white">Jhaz Admin</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
