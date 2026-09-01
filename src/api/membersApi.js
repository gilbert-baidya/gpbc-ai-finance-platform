import { gasFetch } from './gasFetch';

/**
 * Get all members from the database
 * @returns {Promise<Object>} Response with members array
 */
export async function getMembers() {
  return gasFetch("getMembers");
}

/**
 * Add a new member to the database
 * @param {Object} data - Member data (FullName, Email, Phone, Address, etc.)
 * @returns {Promise<Object>} Response with success status and memberId
 */
export async function addMember(data) {
  return gasFetch("addMember", data);
}
