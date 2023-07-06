# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v1.4.1


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 47 | 64 | 63 | 3.65 | 3.68 
 object (hierarchical) | 105 | 108 | 102 | 7.77 | 7.04 
 object (recursive) | 105 | 106 | 99 | 5.99 | 6.35 
 object (union, explicit) | 61 | 62 | 35 | 2.19 | 1.90 
 array (simple) | 67 | 65 | 63 | 3.93 | 4.13 
 array (hierarchical) | 4.35 | 41 | 43 | 1.89 | 3.03 
 array (recursive) | 64 | 83 | 56 | 3.35 | 3.65 
 array (union, explicit) | 77 | 70 | 52 | 3.61 | 4.06 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 47 | 88 | 78 | 5.99 | 5.25 
 object (hierarchical) | 111 | 136 | 104 | 9.66 | 10 
 object (recursive) | 103 | 145 | 52 | 9.22 | 9.08 
 object (union, explicit) | 65 | 81 | 44 | 4.20 | 4.62 
 array (simple) | 75 | 97 | 73 | 9.44 | 10 
 array (hierarchical) | 105 | 107 | 42 | 7.80 | 7.37 
 array (recursive) | 89 | 95 | 56 | 8.48 | 8.33 
 array (union, explicit) | 80 | 87 | 19 | 8.13 | 9.14 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 46 | 76 | 66 | 4.64 | 4.92 
 object (hierarchical) | 70 | 91 | 75 | 9.26 | 9.17 
 object (recursive) | 74 | 84 | 57 | 7.84 | 8.12 
 object (union, explicit) | 44 | 56 | 33 | 1.80 | 1.70 
 array (simple) | 68 | 79 | 51 | 2.48 | 3.84 
 array (hierarchical) | 67 | 67 | 24 | 2.45 | 1.89 
 array (recursive) | 73 | 73 | 63 | 8.16 | 6.92 
 array (union, explicit) | 96 | 99 | 33 | 4.90 | 4.77 

> Unit: Megabytes/sec







Total elapsed time: 4,825,647 ms
