import { promises as fs } from "fs"
import fetch from "node-fetch"
import { getIntrospectionQuery, printSchema, buildClientSchema } from "graphql"

async function main() {
    const introspectionQuery = getIntrospectionQuery()

    const url = `https://${process.env.STORE}.myshopify.com/admin/api/${process.env.API_VERSION}/graphql.json`
    console.log("Request URL:", url)

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: introspectionQuery }),
    })

    const text = await response.text()
    console.log("Raw response:", text)

    let json
    try {
        json = JSON.parse(text)
    } catch (e) {
        console.error("Response is not valid JSON")
        return
    }

    const { data, errors } = json

    if (errors) {
        console.error("GraphQL errors:", JSON.stringify(errors, null, 2))
        return
    }

    if (!data) {
        console.error("No 'data' field in response JSON:", json)
        return
    }

    const schema = buildClientSchema(data)

    const outputFile = "./result.graphql"

    await fs.writeFile(outputFile, printSchema(schema))
    console.log("Schema written to", outputFile)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
