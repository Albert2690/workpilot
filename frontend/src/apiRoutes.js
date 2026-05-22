const apiRoutes = {
  AUTH: {
    LOGIN: "/common/login",
    PROFILE: "/common/profile",
  },

  ADMIN: {
    CREATE_ADMIN: "/admin/create-admin",
    DASHBOARD: "/admin/dashboard",

    CREATE_BOOKING: "/admin/booking/create",
    GET_ALL_BOOKINGS: "/admin/bookings",
    ASSIGN_EMPLOYEE: "/admin/booking/assign",

    GET_EMPLOYEES: "/admin/employees",
    CREATE_EMPLOYEE: "/admin/employee/create",
    UPDATE_EMPLOYEE: "/admin/employee",

    CREATE_BRAND: "/admin/brand/create",
    GET_BRANDS: "/admin/brands",
  },

  EMPLOYEE: {
    GET_ASSIGNED_BOOKINGS: "/user/bookings",
    START_BOOKING: "/user/booking/start",
    COMPLETE_BOOKING: "/user/booking/complete",
  },
};

export default apiRoutes;
