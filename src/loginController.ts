// export async function login(email: string, password: string): Promise<string> {
//   const response = await fetch("hhtp://localhost:3000/api/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({ email, password })
//   });
 
//   if (!response.ok) {
//     throw new Error("Login failed");
//   }
//   const data = await response.json();
//   return data.accessToken; 
// }