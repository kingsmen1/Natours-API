/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
  console.log('login');
  try {
    //axios is used to send http methods from client side to server.
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
    console.log(e.response.data.message);
  }
};

export const logout = async () => {
  console.log('logout function played');
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    // 'location.reload' It trigger's reload from server.
    // It needs to set 'true' if not it will load from the same page/state from cache.
    if (res.data.status == 'success') location.reload(true);
  } catch (e) {
    showAlert('error', 'Error logging out! Try Again .');
  }
};
