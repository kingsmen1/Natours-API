/*eslint-disable */

//updateData
import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  console.log(data, type);
  try {
    const url =
      type === 'data'
        ? '/api/v1/users/updateMe'
        : '/api/v1/users/updateMyPassword';
    const res = await axios({
      method: 'PATCH',
      url,
      data: data,
    });
    console.log(res.status);
    if (res.status === 200) {
      showAlert('success', `${type} Data Updated successfully`);
      //page reloading.
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
