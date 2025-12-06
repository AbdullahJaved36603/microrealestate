/* eslint-env node, jest */
import * as BL from '../../businesslogic/index.js';
import moment from 'moment';

describe('Business Logic - computeRent Unit Tests', () => {
  describe('Single property rental', () => {
    const property = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Office Space',
        price: 1000
      },
      rent: 1000,
      expenses: [
        { title: 'Maintenance', amount: 50 },
        { title: 'Utilities', amount: 100 }
      ]
    };

    const contract = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 0,
      vatRate: 0.2,
      properties: [property]
    };

    test('should compute rent with correct term, month, and year', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      const rentMoment = moment('01/01/2023', 'DD/MM/YYYY HH:mm');
      
      expect(computedRent.term).toEqual(Number(rentMoment.format('YYYYMMDDHH')));
      expect(computedRent.month).toEqual(rentMoment.month() + 1);
      expect(computedRent.year).toEqual(rentMoment.year());
    });

    test('should calculate total preTaxAmount correctly', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      const expectedPreTaxAmount = property.rent + 50 + 100;
      
      expect(computedRent.total.preTaxAmount).toEqual(expectedPreTaxAmount);
    });

    test('should calculate VAT correctly', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      const expectedVAT = Math.round((property.rent + 50 + 100) * 0.2 * 100) / 100;
      
      expect(computedRent.total.vat).toEqual(expectedVAT);
    });

    test('should calculate grandTotal correctly', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      const baseAmount = property.rent + 50 + 100;
      const expectedGrandTotal = Math.round(baseAmount * 1.2 * 100) / 100;
      
      expect(computedRent.total.grandTotal).toEqual(expectedGrandTotal);
    });

    test('should have zero balance for first rent', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      
      expect(computedRent.total.balance).toEqual(0);
    });
  });

  describe('Rent with discount', () => {
    const property = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Retail Shop',
        price: 2000
      },
      rent: 2000,
      expenses: [{ title: 'Service charge', amount: 200 }]
    };

    const contractWithDiscount = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 100,
      vatRate: 0.2,
      properties: [property]
    };

    test('should apply discount correctly', () => {
      const computedRent = BL.computeRent(contractWithDiscount, '01/01/2023');
      
      expect(computedRent.total.discount).toEqual(100);
      expect(computedRent.total.preTaxAmount).toEqual(2000 + 200);
    });

    test('should calculate grandTotal with discount applied', () => {
      const computedRent = BL.computeRent(contractWithDiscount, '01/01/2023');
      const expectedGrandTotal = Math.round((2000 + 200 - 100) * 1.2 * 100) / 100;
      
      expect(computedRent.total.grandTotal).toEqual(expectedGrandTotal);
    });
  });

  describe('Multiple properties rental', () => {
    const property1 = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Office A',
        price: 1500
      },
      rent: 1500,
      expenses: [{ title: 'Maintenance', amount: 75 }]
    };

    const property2 = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Parking Lot',
        price: 500
      },
      rent: 500,
      expenses: [{ title: 'Security', amount: 25 }]
    };

    const multiPropertyContract = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 50,
      vatRate: 0.2,
      properties: [property1, property2]
    };

    test('should calculate rent for multiple properties', () => {
      const computedRent = BL.computeRent(multiPropertyContract, '01/01/2023');
      const expectedPreTaxAmount = 1500 + 75 + 500 + 25;
      
      expect(computedRent.total.preTaxAmount).toEqual(expectedPreTaxAmount);
    });

    test('should apply discount to total of all properties', () => {
      const computedRent = BL.computeRent(multiPropertyContract, '01/01/2023');
      
      expect(computedRent.total.discount).toEqual(50);
    });

    test('should calculate correct grandTotal for multiple properties', () => {
      const computedRent = BL.computeRent(multiPropertyContract, '01/01/2023');
      const baseAmount = 1500 + 75 + 500 + 25 - 50;
      const expectedGrandTotal = Math.round(baseAmount * 1.2 * 100) / 100;
      
      expect(computedRent.total.grandTotal).toEqual(expectedGrandTotal);
    });
  });

  describe('Rent with previous balance (debt)', () => {
    const property = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Studio Apartment',
        price: 800
      },
      rent: 800,
      expenses: []
    };

    const contract = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 0,
      vatRate: 0.2,
      properties: [property]
    };

    test('should carry forward previous balance as debt', () => {
      const firstRent = BL.computeRent(contract, '01/01/2023');
      const secondRent = BL.computeRent(contract, '01/02/2023', firstRent);
      
      expect(secondRent.total.balance).toEqual(firstRent.total.grandTotal);
    });

    test('should accumulate debt over multiple periods', () => {
      const rent1 = BL.computeRent(contract, '01/01/2023');
      const rent2 = BL.computeRent(contract, '01/02/2023', rent1);
      const rent3 = BL.computeRent(contract, '01/03/2023', rent2);
      
      expect(rent3.total.balance).toEqual(rent2.total.grandTotal);
      expect(rent3.total.grandTotal).toBeGreaterThan(rent2.total.grandTotal);
    });
  });

  describe('Rent with zero VAT', () => {
    const property = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Warehouse',
        price: 3000
      },
      rent: 3000,
      expenses: [{ title: 'Insurance', amount: 100 }]
    };

    const contractNoVAT = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 0,
      vatRate: 0,
      properties: [property]
    };

    test('should calculate rent without VAT when rate is 0', () => {
      const computedRent = BL.computeRent(contractNoVAT, '01/01/2023');
      
      expect(computedRent.total.vat).toEqual(0);
      expect(computedRent.total.grandTotal).toEqual(3100);
    });
  });

  describe('Edge cases', () => {
    test('should handle property with no expenses', () => {
      const property = {
        entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
        exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
        property: {
          name: 'Land Plot',
          price: 500
        },
        rent: 500,
        expenses: []
      };

      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        discount: 0,
        vatRate: 0.2,
        properties: [property]
      };

      const computedRent = BL.computeRent(contract, '01/01/2023');
      
      expect(computedRent.total.preTaxAmount).toEqual(500);
      expect(computedRent.total.charges).toEqual(0);
    });

    test('should handle rent date at different times of day', () => {
      const property = {
        entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
        exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
        property: {
          name: 'Shop',
          price: 1200
        },
        rent: 1200,
        expenses: []
      };

      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        discount: 0,
        vatRate: 0.1,
        properties: [property]
      };

      const rent1 = BL.computeRent(contract, '01/06/2023 10:00');
      const rent2 = BL.computeRent(contract, '01/06/2023 15:30');
      
      // Should produce same term for same day
      expect(rent1.term).toEqual(rent2.term);
    });
  });

  describe('Rent structure validation', () => {
    const property = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Test Property',
        price: 1000
      },
      rent: 1000,
      expenses: [{ title: 'Test Expense', amount: 50 }]
    };

    const contract = {
      begin: '01/01/2023',
      end: '31/12/2023',
      discount: 25,
      vatRate: 0.2,
      properties: [property]
    };

    test('should return rent object with all required fields', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      
      expect(computedRent).toHaveProperty('term');
      expect(computedRent).toHaveProperty('month');
      expect(computedRent).toHaveProperty('year');
      expect(computedRent).toHaveProperty('preTaxAmounts');
      expect(computedRent).toHaveProperty('charges');
      expect(computedRent).toHaveProperty('discounts');
      expect(computedRent).toHaveProperty('debts');
      expect(computedRent).toHaveProperty('vats');
      expect(computedRent).toHaveProperty('payments');
      expect(computedRent).toHaveProperty('total');
    });

    test('should have total object with all required fields', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      
      expect(computedRent.total).toHaveProperty('balance');
      expect(computedRent.total).toHaveProperty('preTaxAmount');
      expect(computedRent.total).toHaveProperty('charges');
      expect(computedRent.total).toHaveProperty('discount');
      expect(computedRent.total).toHaveProperty('vat');
      expect(computedRent.total).toHaveProperty('grandTotal');
      expect(computedRent.total).toHaveProperty('payment');
    });

    test('should have arrays for preTaxAmounts, charges, discounts, debts, vats, and payments', () => {
      const computedRent = BL.computeRent(contract, '01/01/2023');
      
      expect(Array.isArray(computedRent.preTaxAmounts)).toBe(true);
      expect(Array.isArray(computedRent.charges)).toBe(true);
      expect(Array.isArray(computedRent.discounts)).toBe(true);
      expect(Array.isArray(computedRent.debts)).toBe(true);
      expect(Array.isArray(computedRent.vats)).toBe(true);
      expect(Array.isArray(computedRent.payments)).toBe(true);
    });
  });
});
