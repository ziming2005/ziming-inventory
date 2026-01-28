import { api } from "../services/api";
import { checkAuth } from "../services/checkAuth";

export const verifySession = async () => {
    const { loggedIn, user } = await checkAuth();
    if (user?.error === "Authentication required") {
      return user;
    } else {
        return { loggedIn: true, user: user };
    }
  };