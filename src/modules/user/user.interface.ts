
export interface RegisteredUserPayload{
    name:string;
    email: string;
    password: string;
    phone ?: string;
    role?: "TENANT" | "LANDLORD" | "ADMIN";
}
