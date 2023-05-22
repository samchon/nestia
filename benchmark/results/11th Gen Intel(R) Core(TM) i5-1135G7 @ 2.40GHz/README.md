# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v1.2.2


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 40 | 60 | 3.60 | 3.63 
 object (hierarchical) | 93 | 95 | 7.39 | 7.47 
 object (recursive) | 97 | 103 | 6.75 | 6.86 
 object (union, explicit) | 66 | 71 | 2.89 | 2.93 
 array (simple) | 93 | 96 | 7.10 | 7.25 
 array (hierarchical) | 103 | 105 | 5.97 | 5.79 
 array (recursive) | 110 | 101 | 6.34 | 6.33 
 array (union, explicit) | 123 | 114 | 6.32 | 5.94 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 65 | 136 | 8.20 | 9.02 
 object (hierarchical) | 141 | 202 | 16 | 18 
 object (recursive) | 158 | 207 | 15 | 15 
 object (union, explicit) | 105 | 133 | 7.16 | 7.13 
 array (simple) | 109 | 149 | 15 | 16 
 array (hierarchical) | 150 | 154 | 13 | 13 
 array (recursive) | 133 | 140 | 14 | 13 
 array (union, explicit) | 120 | 131 | 16 | 15 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 67 | 99 | 7.76 | 8.31 
 object (hierarchical) | 132 | 156 | 14 | 15 
 object (recursive) | 131 | 150 | 14 | 14 
 object (union, explicit) | 81 | 97 | 3.03 | 3.10 
 array (simple) | 111 | 127 | 7.30 | 6.93 
 array (hierarchical) | 125 | 121 | 5.91 | 5.79 
 array (recursive) | 115 | 122 | 12 | 12 
 array (union, explicit) | 120 | 124 | 6.25 | 6.21 

> Unit: Megabytes/sec







Total elapsed time: 1,107,926 ms
