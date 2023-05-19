# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v0.1.0


## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 49 | 104 | 5.87 | 7.79 
 object (hierarchical) | 129 | 164 | 15 | 17 
 object (recursive) | 136 | 163 | 13 | 13 
 object (union, explicit) | 95 | 125 | 7.01 | 6.96 
 array (simple) | 114 | 130 | 15 | 15 
 array (hierarchical) | 162 | 149 | 12 | 13 
 array (recursive) | 133 | 138 | 14 | 13 
 array (union, explicit) | 124 | 132 | 16 | 15 

> Unit: Megabytes/sec







Total elapsed time: 448,468 ms
