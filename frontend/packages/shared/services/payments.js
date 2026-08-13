import api from './api.js';

export const paymentService = {
  processDeposit: async (interestId) => {
    const response = await api.post('/payments/deposit', null, {
      params: { interestId: interestId.toString() }
    });
    return response.data;
  },

  processRemainingBalancePayment: async (interestId) => {
    const response = await api.post('/payments/remaining', null, {
      params: { interestId: interestId.toString() }
    });
    return response.data;
  },

  processFullPaymentForDirectOrder: async (interestId) => {
    const response = await api.post('/payments/full-payment', null, {
      params: { interestId: interestId.toString() }
    });
    return response.data;
  },

  getUserPayments: async () => {
    const response = await api.get('/payments/my');
    return response.data;
  },

  processAdditionalDepositPayment: async (interestId, amount) => {
    const response = await api.post('/payments/additional-deposit', null, {
      params: { 
        interestId: interestId.toString(),
        amount: amount.toString()
      }
    });
    return response.data;
  }
};

export default paymentService;
