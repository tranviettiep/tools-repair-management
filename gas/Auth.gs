// ============================================
// Auth.gs - Authentication service
// ============================================

const AuthService = {
  login(username, passwordHash) {
    const users = getSheetData(SHEETS.USERS);
    const user = users.find(u => u.username === username && u.is_active === true);

    if (!user) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    if (user.password_hash !== passwordHash) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Generate token
    const token = Utilities.getUuid();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours

    // Store session
    const sessionsSheet = getSheet(SHEETS.SESSIONS);
    sessionsSheet.appendRow([token, user.id, new Date().toISOString(), expiresAt]);

    // Return user data (without password)
    const userData = { ...user };
    delete userData.password_hash;

    return {
      success: true,
      data: {
        token: token,
        user: userData
      }
    };
  },

  verifyToken(token) {
    if (!token) return { success: false, error: 'No token' };

    const sessions = getSheetData(SHEETS.SESSIONS);
    const session = sessions.find(s => s.token === token);

    if (!session) return { success: false, error: 'Invalid token' };

    if (new Date() > new Date(session.expires_at)) {
      // Expired, clean up
      this.logout(token);
      return { success: false, error: 'Token expired' };
    }

    return { success: true };
  },

  logout(token) {
    if (!token) return { success: true };

    const sheet = getSheet(SHEETS.SESSIONS);
    const data = sheet.getDataRange().getValues();

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === token) {
        sheet.deleteRow(i + 1);
        break;
      }
    }

    return { success: true };
  },

  // Clean up expired sessions (run via trigger)
  cleanupSessions() {
    const sheet = getSheet(SHEETS.SESSIONS);
    const data = sheet.getDataRange().getValues();
    const now = new Date();

    for (let i = data.length - 1; i >= 1; i--) {
      if (new Date(data[i][3]) < now) {
        sheet.deleteRow(i + 1);
      }
    }
  }
};
