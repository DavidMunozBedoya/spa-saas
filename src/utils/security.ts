import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña de forma segura usando bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con un hash almacenado.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
