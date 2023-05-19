# Benchmark of `nestia`
> - CPU: AMD Ryzen 7 6800HS with Radeon Graphics
> - Memory: 64,780 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v0.1.0


## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 45 | 63 | 8.26 | 9.29 
 object (hierarchical) | 115 | 136 | 17 | 18 
 object (recursive) | 124 | 149 | 15 | 16 
 object (union, explicit) | 99 | 118 | 7.38 | 7.39 
 array (simple) | 76 | 96 | 16 | 16 
 array (hierarchical) | 149 | 151 | 14 | 14 
 array (recursive) | 117 | 121 | 15 | 15 
 array (union, explicit) | 114 | 127 | 17 | 17 

> Unit: Megabytes/sec







Total elapsed time: 432,263 ms
