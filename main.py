import random
from collections import Counter

# Edit these to set initial population sizes
num_RR = 1
num_Rr = 1
num_rr = 1

# Build population list from counts
population = (["RR"] * num_RR) + (["Rr"] * num_Rr) + (["rr"] * num_rr)

def offspring(p1, p2):
    # pick one allele from each parent at random
    a1 = random.choice(list(p1))
    a2 = random.choice(list(p2))
    # sort so "rR" becomes "Rr"
    return "".join(sorted(a1 + a2))

n = 1000000  # number of matings to simulate
offspring_list = []

for i in range(n):
    parent1 = random.choice(population)
    parent2 = random.choice(population)
    child = offspring(parent1, parent2)
    offspring_list.append(child)
    # print(f"Trial {i+1}: {parent1} x {parent2} -> {child}")
   
# Count and print how many of each genotype in the offspring
counts = Counter(offspring_list)
print("\nOffspring genotype counts:")
print("RR:", counts["RR"])
print("Rr:", counts["Rr"])
print("rr:", counts["rr"])