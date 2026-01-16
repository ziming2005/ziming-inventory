import { api } from "../services/api";
import { checkAuth } from "../services/checkAuth";

export const verifySession = async () => {
    const { loggedIn, user } = await checkAuth();
    if (user?.error === "Authentication required") {
      console.log('user error: ',user);
      return { loggedIn: false, user: null };
    } else {
        return { loggedIn: true, user: user };
    }
  };