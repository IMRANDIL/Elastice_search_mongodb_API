import json
import random

categories = ["Mouse", "Pendrive", "Monitor", "Keyboard", "Headphones", "Laptop", "Printer", "Tablet"]

products = []

for i in range(1, 10001):
    product = {
        "name": f"Product {i}",
        "description": f"This is product number {i} description.",
        "category": random.choice(categories),
        "price": random.randint(1000, 100000)
    }
    products.append(product)

with open("products.json", "w") as f:
    json.dump(products, f, indent=2)
