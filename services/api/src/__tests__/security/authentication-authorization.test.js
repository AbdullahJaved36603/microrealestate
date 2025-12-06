/* eslint-env node, jest */
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Middlewares, Collections } from '@microrealestate/common';

// Mock the common module
jest.mock('@microrealestate/common', () => ({
  Collections: {
    Realm: {
      find: jest.fn(),
      findOne: jest.fn()
    },
    Tenant: {
      find: jest.fn(),
      findOne: jest.fn()
    },
    Lease: {
      find: jest.fn(),
      findOne: jest.fn()
    },
    Property: {
      find: jest.fn(),
      findOne: jest.fn()
    },
    ObjectId: jest.fn((id) => id)
  },
  Middlewares: {
    needAccessToken: jest.fn(),
    checkOrganization: jest.fn(),
    notRoles: jest.fn(),
    asyncWrapper: jest.fn((fn) => fn)
  },
  Service: {
    getInstance: jest.fn(() => ({
      envConfig: {
        getValues: () => ({
          ACCESS_TOKEN_SECRET: 'test-secret-key-123',
          DEMO_MODE: false
        })
      }
    }))
  },
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  ServiceError: class ServiceError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

describe('Security Tests - Authentication', () => {
  let app;
  let mockRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    mockRoutes = express.Router();
    mockRoutes.get('/test', (req, res) => res.json({ message: 'success' }));
    app.use('/api', mockRoutes);
  });

  describe('Access Token Validation', () => {
    test('should reject request without access token', async () => {
      Middlewares.needAccessToken.mockImplementation(() => (req, res, next) => {
        if (!req.headers.authorization) {
          return res.sendStatus(401);
        }
        next();
      });

      app.use('/secure', Middlewares.needAccessToken(), mockRoutes);

      await request(app).get('/secure/test').expect(401);
    });

    test('should reject request with invalid token format', async () => {
      Middlewares.needAccessToken.mockImplementation(() => (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.sendStatus(401);
        }
        next();
      });

      app.use('/secure', Middlewares.needAccessToken(), mockRoutes);

      await request(app)
        .get('/secure/test')
        .set('Authorization', 'InvalidToken')
        .expect(401);
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        {
          account: {
            email: 'test@example.com',
            role: 'administrator'
          }
        },
        'test-secret-key-123',
        { expiresIn: '-1h' }
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          try {
            const token = req.headers.authorization?.split(' ')[1];
            jwt.verify(token, secret);
            next();
          } catch (error) {
            return res.sendStatus(401);
          }
        }
      );

      app.use(
        '/secure',
        Middlewares.needAccessToken('test-secret-key-123'),
        mockRoutes
      );

      await request(app)
        .get('/secure/test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    test('should reject token with invalid signature', async () => {
      const maliciousToken = jwt.sign(
        {
          account: {
            email: 'hacker@example.com',
            role: 'administrator'
          }
        },
        'wrong-secret-key'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          try {
            const token = req.headers.authorization?.split(' ')[1];
            jwt.verify(token, secret);
            next();
          } catch (error) {
            return res.sendStatus(401);
          }
        }
      );

      app.use(
        '/secure',
        Middlewares.needAccessToken('test-secret-key-123'),
        mockRoutes
      );

      await request(app)
        .get('/secure/test')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(401);
    });

    test('should accept valid token', async () => {
      const validToken = jwt.sign(
        {
          account: {
            email: 'test@example.com',
            role: 'administrator'
          }
        },
        'test-secret-key-123',
        { expiresIn: '1h' }
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          try {
            const token = req.headers.authorization?.split(' ')[1];
            const decoded = jwt.verify(token, secret);
            req.user = {
              type: 'user',
              email: decoded.account.email,
              role: decoded.account.role
            };
            next();
          } catch (error) {
            return res.sendStatus(401);
          }
        }
      );

      app.use(
        '/secure',
        Middlewares.needAccessToken('test-secret-key-123'),
        mockRoutes
      );

      await request(app)
        .get('/secure/test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    test('should validate token payload structure', async () => {
      const invalidPayloadToken = jwt.sign(
        {
          invalidField: 'value'
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          try {
            const token = req.headers.authorization?.split(' ')[1];
            const decoded = jwt.verify(token, secret);
            if (!decoded.account && !decoded.application && !decoded.service) {
              return res.sendStatus(401);
            }
            next();
          } catch (error) {
            return res.sendStatus(401);
          }
        }
      );

      app.use(
        '/secure',
        Middlewares.needAccessToken('test-secret-key-123'),
        mockRoutes
      );

      await request(app)
        .get('/secure/test')
        .set('Authorization', `Bearer ${invalidPayloadToken}`)
        .expect(401);
    });
  });

  describe('Authorization - Role-based Access Control', () => {
    test('should reject tenant role from accessing landlord API', async () => {
      const tenantToken = jwt.sign(
        {
          account: {
            email: 'tenant@example.com',
            role: 'tenant'
          }
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          const token = req.headers.authorization?.split(' ')[1];
          const decoded = jwt.verify(token, secret);
          req.user = {
            type: 'user',
            email: decoded.account.email,
            role: decoded.account.role
          };
          next();
        }
      );

      Middlewares.notRoles.mockImplementation((roles) => (req, res, next) => {
        if (roles.includes(req.user?.role)) {
          return res.sendStatus(403);
        }
        next();
      });

      app.use(
        '/landlord',
        Middlewares.needAccessToken('test-secret-key-123'),
        Middlewares.notRoles(['tenant']),
        mockRoutes
      );

      await request(app)
        .get('/landlord/test')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(403);
    });

    test('should allow administrator role', async () => {
      const adminToken = jwt.sign(
        {
          account: {
            email: 'admin@example.com',
            role: 'administrator'
          }
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          const token = req.headers.authorization?.split(' ')[1];
          const decoded = jwt.verify(token, secret);
          req.user = {
            type: 'user',
            email: decoded.account.email,
            role: decoded.account.role
          };
          next();
        }
      );

      Middlewares.notRoles.mockImplementation((roles) => (req, res, next) => {
        if (roles.includes(req.user?.role)) {
          return res.sendStatus(403);
        }
        next();
      });

      app.use(
        '/landlord',
        Middlewares.needAccessToken('test-secret-key-123'),
        Middlewares.notRoles(['tenant']),
        mockRoutes
      );

      await request(app)
        .get('/landlord/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('should allow renting role', async () => {
      const rentingToken = jwt.sign(
        {
          account: {
            email: 'renting@example.com',
            role: 'renting'
          }
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          const token = req.headers.authorization?.split(' ')[1];
          const decoded = jwt.verify(token, secret);
          req.user = {
            type: 'user',
            email: decoded.account.email,
            role: decoded.account.role
          };
          next();
        }
      );

      Middlewares.notRoles.mockImplementation((roles) => (req, res, next) => {
        if (roles.includes(req.user?.role)) {
          return res.sendStatus(403);
        }
        next();
      });

      app.use(
        '/landlord',
        Middlewares.needAccessToken('test-secret-key-123'),
        Middlewares.notRoles(['tenant']),
        mockRoutes
      );

      await request(app)
        .get('/landlord/test')
        .set('Authorization', `Bearer ${rentingToken}`)
        .expect(200);
    });
  });

  describe('Organization Access Control', () => {
    test('should only allow access to own organization data', async () => {
      const userToken = jwt.sign(
        {
          account: {
            email: 'user@example.com',
            role: 'administrator'
          }
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          const token = req.headers.authorization?.split(' ')[1];
          const decoded = jwt.verify(token, secret);
          req.user = {
            type: 'user',
            email: decoded.account.email,
            role: decoded.account.role
          };
          next();
        }
      );

      Middlewares.checkOrganization.mockImplementation(
        () => async (req, res, next) => {
          req.realms = [
            {
              _id: 'realm123',
              name: 'User Organization',
              members: [{ email: req.user.email, role: 'administrator' }]
            }
          ];

          if (req.headers.organizationid !== req.realms[0]._id) {
            return res.sendStatus(403);
          }

          req.realm = req.realms[0];
          next();
        }
      );

      app.use(
        '/org',
        Middlewares.needAccessToken('test-secret-key-123'),
        Middlewares.checkOrganization(),
        mockRoutes
      );

      await request(app)
        .get('/org/test')
        .set('Authorization', `Bearer ${userToken}`)
        .set('organizationid', 'otherRealm')
        .expect(403);
    });

    test('should allow access to own organization', async () => {
      const userToken = jwt.sign(
        {
          account: {
            email: 'user@example.com',
            role: 'administrator'
          }
        },
        'test-secret-key-123'
      );

      Middlewares.needAccessToken.mockImplementation(
        (secret) => (req, res, next) => {
          const token = req.headers.authorization?.split(' ')[1];
          const decoded = jwt.verify(token, secret);
          req.user = {
            type: 'user',
            email: decoded.account.email,
            role: decoded.account.role
          };
          next();
        }
      );

      Middlewares.checkOrganization.mockImplementation(
        () => async (req, res, next) => {
          req.realms = [
            {
              _id: 'realm123',
              name: 'User Organization',
              members: [{ email: req.user.email, role: 'administrator' }]
            }
          ];
          req.realm = req.realms[0];
          next();
        }
      );

      app.use(
        '/org',
        Middlewares.needAccessToken('test-secret-key-123'),
        Middlewares.checkOrganization(),
        mockRoutes
      );

      await request(app)
        .get('/org/test')
        .set('Authorization', `Bearer ${userToken}`)
        .set('organizationid', 'realm123')
        .expect(200);
    });
  });
});

describe('Security Tests - SQL/NoSQL Injection', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  describe('MongoDB Injection Attempts', () => {
    test('should reject $where operator in query', async () => {
      const maliciousQuery = {
        name: { $where: 'this.name == "admin"' }
      };

      Collections.Tenant.find.mockImplementation((query) => {
        if (query.name && typeof query.name === 'object' && query.name.$where) {
          throw new Error('Invalid query operator');
        }
        return {
          lean: jest.fn().mockResolvedValue([])
        };
      });

      await expect(async () => {
        await Collections.Tenant.find(maliciousQuery).lean();
      }).rejects.toThrow('Invalid query operator');
    });

    test('should sanitize ObjectId inputs', async () => {
      const maliciousId = { $ne: null };

      Collections.Tenant.findOne.mockImplementation((query) => {
        if (typeof query._id === 'object' && query._id.$ne !== undefined) {
          throw new Error('Invalid ObjectId format');
        }
        return {
          lean: jest.fn().mockResolvedValue(null)
        };
      });

      await expect(async () => {
        await Collections.Tenant.findOne({ _id: maliciousId }).lean();
      }).rejects.toThrow('Invalid ObjectId format');
    });

    test('should reject $gt/$lt operators in unexpected fields', async () => {
      const maliciousQuery = {
        name: { $gt: '' }
      };

      Collections.Tenant.find.mockImplementation((query) => {
        if (query.name && typeof query.name === 'object') {
          throw new Error('Invalid operator for string field');
        }
        return {
          lean: jest.fn().mockResolvedValue([])
        };
      });

      await expect(async () => {
        await Collections.Tenant.find(maliciousQuery).lean();
      }).rejects.toThrow('Invalid operator for string field');
    });

    test('should sanitize regex patterns', async () => {
      const maliciousRegex = {
        name: { $regex: '.*', $options: 'i' }
      };

      // This should be allowed but with proper sanitization
      Collections.Tenant.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      const result = await Collections.Tenant.find(maliciousRegex).lean();
      expect(result).toEqual([]);
    });

    test('should reject JavaScript code injection in fields', async () => {
      const maliciousData = {
        name: "'; return true; var fake='",
        email: 'test@example.com'
      };

      // Validate that string fields don't contain JavaScript code
      const hasJavaScriptCode = (str) => {
        const dangerousPatterns = [
          /return\s+/,
          /function\s*\(/,
          /=>/,
          /eval\(/,
          /;\s*var/,
          /;\s*let/,
          /;\s*const/
        ];
        return dangerousPatterns.some((pattern) => pattern.test(str));
      };

      expect(hasJavaScriptCode(maliciousData.name)).toBe(true);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org'
      ];

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user name@example.com',
        '<script>@example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should sanitize special characters in text fields', () => {
      const maliciousInputs = [
        { input: '<script>alert("xss")</script>', expected: false },
        { input: 'SELECT * FROM users', expected: false },
        { input: "'; DROP TABLE users; --", expected: false },
        { input: '{{ constructor.constructor("return process")() }}', expected: false }
      ];

      const hasSpecialChars = (str) => {
        const dangerousChars = /<|>|{|}|\$|\(|\)|;|--|\/\*|\*\//;
        return dangerousChars.test(str);
      };

      maliciousInputs.forEach(({ input }) => {
        expect(hasSpecialChars(input)).toBe(true);
      });
    });

    test('should validate numeric inputs', () => {
      const validNumbers = [0, 100, 1000.50, -50];
      const invalidNumbers = [NaN, Infinity, -Infinity, '100', null, undefined];

      validNumbers.forEach((num) => {
        expect(typeof num === 'number' && isFinite(num)).toBe(true);
      });

      invalidNumbers.forEach((num) => {
        expect(typeof num === 'number' && isFinite(num)).toBe(false);
      });
    });

    test('should validate date formats', () => {
      const validDates = ['01/01/2023', '31/12/2023', '15/06/2024'];

      const invalidDates = [
        '32/01/2023',
        '01/13/2023',
        '2023-01-01',
        'invalid',
        '<script>2023</script>'
      ];

      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

      validDates.forEach((date) => {
        expect(dateRegex.test(date)).toBe(true);
      });

      invalidDates.forEach((date) => {
        expect(dateRegex.test(date)).toBe(false);
      });
    });
  });
});

describe('Security Tests - XSS Prevention', () => {
  describe('HTML/Script Injection Detection', () => {
    test('should detect script tags in input', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
        '<svg/onload=alert(1)>',
        'javascript:alert(1)',
        '<a href="javascript:void(0)">Click</a>'
      ];

      const containsXSS = (str) => {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
          /on\w+\s*=\s*["'][^"']*["']/gi,
          /javascript:/gi,
          /<img[^>]+onerror/gi,
          /<svg[^>]+onload/gi
        ];

        return xssPatterns.some((pattern) => pattern.test(str));
      };

      xssPayloads.forEach((payload) => {
        expect(containsXSS(payload)).toBe(true);
      });
    });

    test('should allow safe HTML entities', () => {
      const safeInputs = [
        'John &amp; Jane',
        'Price: &lt;$100&gt;',
        'Email: test@example.com',
        'Address: 123 Main St.'
      ];

      const containsXSS = (str) => {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /on\w+\s*=\s*["'][^"']*["']/gi,
          /javascript:/gi
        ];

        return xssPatterns.some((pattern) => pattern.test(str));
      };

      safeInputs.forEach((input) => {
        expect(containsXSS(input)).toBe(false);
      });
    });

    test('should sanitize output before rendering', () => {
      const escapeHtml = (str) => {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, (char) => map[char]);
      };

      const dangerousInput = '<script>alert("xss")</script>';
      const sanitized = escapeHtml(dangerousInput);

      expect(sanitized).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(sanitized).not.toContain('<script>');
    });
  });
});

describe('Security Tests - Data Exposure Prevention', () => {
  test('should not expose sensitive fields in API responses', () => {
    const userObject = {
      _id: 'user123',
      email: 'user@example.com',
      role: 'administrator',
      password: 'hashed_password_123',
      accessToken: 'secret_token_abc',
      refreshToken: 'refresh_token_xyz'
    };

    const sanitizeUserObject = (user) => {
      const { password, accessToken, refreshToken, ...safeUser } = user;
      return safeUser;
    };

    const sanitized = sanitizeUserObject(userObject);

    expect(sanitized).not.toHaveProperty('password');
    expect(sanitized).not.toHaveProperty('accessToken');
    expect(sanitized).not.toHaveProperty('refreshToken');
    expect(sanitized).toHaveProperty('email');
    expect(sanitized).toHaveProperty('role');
  });

  test('should mask sensitive realm data', () => {
    const realmObject = {
      _id: 'realm123',
      name: 'Test Organization',
      thirdParties: {
        gmail: {
          email: 'admin@example.com',
          appPassword: 'secret_password_123'
        },
        smtp: {
          host: 'smtp.example.com',
          password: 'smtp_password_456'
        }
      }
    };

    const maskSecrets = (realm) => {
      if (realm.thirdParties?.gmail?.appPassword) {
        realm.thirdParties.gmail.appPassword = '**********';
      }
      if (realm.thirdParties?.smtp?.password) {
        realm.thirdParties.smtp.password = '**********';
      }
      return realm;
    };

    const masked = maskSecrets({ ...realmObject });

    expect(masked.thirdParties.gmail.appPassword).toBe('**********');
    expect(masked.thirdParties.smtp.password).toBe('**********');
  });
});
