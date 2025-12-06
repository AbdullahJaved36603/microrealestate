/* eslint-env node, jest */
import * as Contract from '../../managers/contract.js';
import moment from 'moment';

describe('Contract Manager - Unit Tests', () => {
  describe('create() - Contract creation', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Office Space',
        price: 1000
      },
      rent: 1000,
      expenses: [{ title: 'Maintenance', amount: 50 }]
    };

    test('should create contract with monthly frequency', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result).toHaveProperty('rents');
      expect(result.rents).toHaveLength(12);
      expect(result.terms).toBe(12);
    });

    test('should create contract with yearly frequency', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2025',
        frequency: 'years',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents).toHaveLength(3);
      expect(result.terms).toBe(3);
    });

    test('should create contract with weekly frequency', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/01/2023',
        frequency: 'weeks',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents.length).toBeGreaterThan(0);
      expect(result.terms).toBeGreaterThan(0);
    });

    test('should throw error for unsupported frequency', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'decades',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow(
        'unsupported frequency, should be one of these hours, days, weeks, months, years'
      );
    });

    test('should throw error when frequency is not provided', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow('unsupported frequency');
    });

    test('should throw error when properties are empty', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: []
      };

      expect(() => Contract.create(contract)).toThrow(
        'properties not defined or empty'
      );
    });

    test('should throw error when properties are not defined', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2
      };

      expect(() => Contract.create(contract)).toThrow(
        'properties not defined or empty'
      );
    });

    test('should throw error when end date is before begin date', () => {
      const contract = {
        begin: '31/12/2023',
        end: '01/01/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow(
        'contract duration is not correct, check begin/end contract date'
      );
    });

    test('should throw error when end date equals begin date', () => {
      const contract = {
        begin: '01/01/2023',
        end: '01/01/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow(
        'contract duration is not correct'
      );
    });

    test('should generate rents with increasing terms', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents[0].term).toBeLessThan(result.rents[1].term);
      expect(result.rents[1].term).toBeLessThan(result.rents[2].term);
    });

    test('should accumulate balance across rent periods', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents[0].total.balance).toBe(0);
      expect(result.rents[1].total.balance).toBeGreaterThan(0);
      expect(result.rents[2].total.balance).toBeGreaterThan(
        result.rents[1].total.balance
      );
    });
  });

  describe('create() - Contract with termination', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Shop',
        price: 800
      },
      rent: 800,
      expenses: []
    };

    test('should create contract with early termination', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        termination: '30/06/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents.length).toBeLessThan(12);
      expect(result.rents.length).toBe(6);
    });

    test('should throw error when termination is before begin', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        termination: '01/12/2022',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow(
        'termination date is out of the contract time frame'
      );
    });

    test('should throw error when termination is after end', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/12/2023',
        termination: '31/01/2024',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() => Contract.create(contract)).toThrow(
        'termination date is out of the contract time frame'
      );
    });
  });

  describe('update() - Contract modification', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Apartment',
        price: 1200
      },
      rent: 1200,
      expenses: [{ title: 'Service', amount: 100 }]
    };

    test('should update contract with new discount', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const updatedContract = Contract.update(originalContract, {
        discount: 100
      });

      expect(updatedContract.discount).toBe(100);
      expect(updatedContract.rents[0].total.discount).toBe(100);
    });

    test('should update contract with new VAT rate', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const updatedContract = Contract.update(originalContract, {
        vatRate: 0.1
      });

      expect(updatedContract.vatRate).toBe(0.1);
    });

    test('should preserve payments when updating contract', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      // Add payment
      const term = originalContract.rents[0].term;
      const paidContract = Contract.payTerm(originalContract, term, {
        payments: [
          {
            date: '15/01/2023',
            amount: 500,
            type: 'cash',
            reference: 'PAY001'
          }
        ],
        vats: [],
        discounts: [],
        debts: []
      });

      const updatedContract = Contract.update(paidContract, { discount: 50 });

      expect(updatedContract.rents[0].payments.length).toBeGreaterThan(0);
      expect(updatedContract.rents[0].payments[0].amount).toBe(500);
    });

    test('should extend contract end date', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/06/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const extendedContract = Contract.update(originalContract, {
        end: '31/12/2023'
      });

      expect(extendedContract.rents.length).toBeGreaterThan(
        originalContract.rents.length
      );
    });
  });

  describe('renew() - Contract renewal', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2024', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Office',
        price: 1500
      },
      rent: 1500,
      expenses: []
    };

    test('should renew contract for same duration', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const renewedContract = Contract.renew(originalContract);

      expect(renewedContract.rents.length).toBe(originalContract.rents.length * 2);
      expect(renewedContract.terms).toBe(originalContract.terms);
    });

    test('should renew contract with correct end date', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const renewedContract = Contract.renew(originalContract);
      const expectedEndDate = moment('31/12/2024', 'DD/MM/YYYY');

      expect(moment(renewedContract.end).format('DD/MM/YYYY')).toBe(
        expectedEndDate.format('DD/MM/YYYY')
      );
    });
  });

  describe('terminate() - Contract termination', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Warehouse',
        price: 2000
      },
      rent: 2000,
      expenses: []
    };

    test('should terminate contract early', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const terminatedContract = Contract.terminate(
        originalContract,
        '30/06/2023'
      );

      expect(terminatedContract.rents.length).toBeLessThan(
        originalContract.rents.length
      );
      expect(terminatedContract.termination).toBe('30/06/2023');
    });

    test('should have fewer rents after termination', () => {
      const originalContract = Contract.create({
        begin: '01/01/2023',
        end: '31/12/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const terminatedContract = Contract.terminate(
        originalContract,
        '31/03/2023'
      );

      expect(terminatedContract.rents.length).toBe(3);
    });
  });

  describe('payTerm() - Payment processing', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Retail Space',
        price: 1800
      },
      rent: 1800,
      expenses: [{ title: 'Utilities', amount: 200 }]
    };

    test('should add payment to specific term', () => {
      const contract = Contract.create({
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const term = contract.rents[0].term;
      const paidContract = Contract.payTerm(contract, term, {
        payments: [
          {
            date: '15/01/2023',
            amount: 1000,
            type: 'check',
            reference: 'CHK123'
          }
        ],
        vats: [],
        discounts: [],
        debts: []
      });

      expect(paidContract.rents[0].payments.length).toBeGreaterThan(0);
      expect(paidContract.rents[0].payments[0].amount).toBe(1000);
    });

    test('should update subsequent rent balances after payment', () => {
      const contract = Contract.create({
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const term = contract.rents[0].term;
      const paidContract = Contract.payTerm(contract, term, {
        payments: [
          {
            date: '15/01/2023',
            amount: 2400,
            type: 'transfer',
            reference: 'TRF456'
          }
        ],
        vats: [],
        discounts: [],
        debts: []
      });

      expect(paidContract.rents[0].total.payment).toBe(2400);
      expect(paidContract.rents[1].total.balance).toBeLessThan(
        contract.rents[1].total.balance
      );
    });

    test('should throw error when paying without rents', () => {
      const contract = {
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      expect(() =>
        Contract.payTerm(contract, 2023010100, {
          payments: [{ date: '15/01/2023', amount: 1000 }],
          vats: [],
          discounts: [],
          debts: []
        })
      ).toThrow('cannot pay term, the rents were not generated');
    });

    test('should add settlement discount', () => {
      const contract = Contract.create({
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const term = contract.rents[0].term;
      const paidContract = Contract.payTerm(contract, term, {
        payments: [],
        vats: [],
        discounts: [
          {
            origin: 'settlement',
            description: 'Early payment discount',
            amount: 100
          }
        ],
        debts: []
      });

      const settlementDiscounts = paidContract.rents[0].discounts.filter(
        (d) => d.origin === 'settlement'
      );
      expect(settlementDiscounts.length).toBeGreaterThan(0);
      expect(settlementDiscounts[0].amount).toBe(100);
    });

    test('should add debt to rent', () => {
      const contract = Contract.create({
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const term = contract.rents[0].term;
      const paidContract = Contract.payTerm(contract, term, {
        payments: [],
        vats: [],
        discounts: [],
        debts: [
          {
            description: 'Late fee',
            amount: 50
          }
        ]
      });

      expect(paidContract.rents[0].debts.length).toBeGreaterThan(0);
    });

    test('should handle multiple payments for same term', () => {
      const contract = Contract.create({
        begin: '01/01/2023',
        end: '31/03/2023',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      });

      const term = contract.rents[0].term;
      const paidContract = Contract.payTerm(contract, term, {
        payments: [
          {
            date: '10/01/2023',
            amount: 500,
            type: 'cash',
            reference: 'CASH001'
          },
          {
            date: '20/01/2023',
            amount: 1000,
            type: 'check',
            reference: 'CHK002'
          }
        ],
        vats: [],
        discounts: [],
        debts: []
      });

      expect(paidContract.rents[0].payments.length).toBe(2);
      expect(paidContract.rents[0].total.payment).toBe(1500);
    });
  });

  describe('Edge cases and validation', () => {
    const baseProperty = {
      entryDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
      exitDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
      property: {
        name: 'Test Property',
        price: 500
      },
      rent: 500,
      expenses: []
    };

    test('should handle contract with days frequency', () => {
      const contract = {
        begin: '01/01/2023',
        end: '10/01/2023',
        frequency: 'days',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents.length).toBe(10);
    });

    test('should handle contract with hours frequency', () => {
      const contract = {
        begin: '01/01/2023 00:00',
        end: '01/01/2023 23:00',
        frequency: 'hours',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.rents.length).toBe(24);
    });

    test('should calculate correct terms count', () => {
      const contract = {
        begin: '01/01/2023',
        end: '01/01/2024',
        frequency: 'months',
        discount: 0,
        vatRate: 0.2,
        properties: [baseProperty]
      };

      const result = Contract.create(contract);

      expect(result.terms).toBe(12);
      expect(result.rents.length).toBe(12);
    });
  });
});
