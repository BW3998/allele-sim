import random
from collections import Counter
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)


def offspring(p1, p2):
    a1 = random.choice(list(p1))
    a2 = random.choice(list(p2))
    return "".join(sorted(a1 + a2))


def run_simulation(num_RR, num_Rr, num_rr, num_matings):
    population = (["RR"] * num_RR) + (["Rr"] * num_Rr) + (["rr"] * num_rr)

    if not population:
        return {"error": "Population must have at least one individual."}

    offspring_list = []
    for _ in range(num_matings):
        parent1 = random.choice(population)
        parent2 = random.choice(population)
        child = offspring(parent1, parent2)
        offspring_list.append(child)

    counts = Counter(offspring_list)
    total = sum(counts.values())

    total_alleles = 2 * len(population)
    freq_R = (2 * num_RR + num_Rr) / total_alleles
    freq_r = (2 * num_rr + num_Rr) / total_alleles

    expected_RR = freq_R ** 2
    expected_Rr = 2 * freq_R * freq_r
    expected_rr = freq_r ** 2

    return {
        "counts": {
            "RR": counts.get("RR", 0),
            "Rr": counts.get("Rr", 0),
            "rr": counts.get("rr", 0),
        },
        "percentages": {
            "RR": round(counts.get("RR", 0) / total * 100, 2) if total else 0,
            "Rr": round(counts.get("Rr", 0) / total * 100, 2) if total else 0,
            "rr": round(counts.get("rr", 0) / total * 100, 2) if total else 0,
        },
        "hardy_weinberg": {
            "freq_R": round(freq_R, 4),
            "freq_r": round(freq_r, 4),
            "expected_RR": round(expected_RR * 100, 2),
            "expected_Rr": round(expected_Rr * 100, 2),
            "expected_rr": round(expected_rr * 100, 2),
        },
        "total": total,
        "population_size": len(population),
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/simulate", methods=["POST"])
def simulate():
    data = request.get_json()
    num_RR = int(data.get("num_RR", 1))
    num_Rr = int(data.get("num_Rr", 1))
    num_rr = int(data.get("num_rr", 1))
    num_matings = int(data.get("num_matings", 100000))

    num_matings = min(num_matings, 5_000_000)

    result = run_simulation(num_RR, num_Rr, num_rr, num_matings)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
