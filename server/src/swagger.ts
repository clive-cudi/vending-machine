import swaggerAutogen from "swagger-autogen";

const outputFile = './swagger_routes.json';
const endpointFiles = [
    "./routes/admin.ts",
    "./routes/customer.ts"
];

swaggerAutogen(outputFile, endpointFiles);