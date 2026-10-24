import { Exchange, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Check for exchanges past their 72h expiration window.
 * Marks them as expired and adds strikes to users who didn't confirm.
 * 3 strikes = automatic temporary ban.
 */
export async function checkExpiredExchanges() {
  const now = new Date();

  const expiredExchanges = await Exchange.findAll({
    where: {
      status: 'formalized',
      expires_at: { [Op.lt]: now },
    },
  });

  for (const exchange of expiredExchanges) {
    await exchange.update({ status: 'expired' });

    // Add strike to users who didn't confirm
    const usersToStrike = [];
    if (!exchange.requester_confirmed) usersToStrike.push(exchange.requester_id);
    if (!exchange.owner_confirmed) usersToStrike.push(exchange.owner_id);

    for (const userId of usersToStrike) {
      const user = await User.findByPk(userId);
      if (user) {
        const newStrikes = user.strikes + 1;
        const updateData = { strikes: newStrikes };

        // 3 strikes = auto ban for 15 days
        if (newStrikes >= 3) {
          updateData.is_banned = true;
          updateData.ban_type = 'temporary';
          updateData.ban_until = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
          updateData.ban_reason = `Suspension automatica: ${newStrikes} intercambios incumplidos. No se confirmo la recepcion dentro de las 72 horas establecidas.`;
        }

        await user.update(updateData);
      }
    }
  }

  if (expiredExchanges.length > 0) {
    console.log(`Processed ${expiredExchanges.length} expired exchanges.`);
  }

  return expiredExchanges.length;
}

/**
 * Generate a unique 8-character exchange code
 */
export function generateExchangeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
