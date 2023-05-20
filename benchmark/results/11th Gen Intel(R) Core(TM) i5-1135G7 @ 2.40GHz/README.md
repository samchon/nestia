# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v1.2.2


## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 46 | 128 | 7.08 | 6.25 
 object (hierarchical) | 138 | 177 | 14 | 16 
 object (recursive) | 139 | 190 | 14 | 15 
 object (union, explicit) | 96 | 126 | 6.86 | 6.87 
 array (simple) | 111 | 134 | 15 | 15 
 array (hierarchical) | 144 | 143 | 13 | 12 
 array (recursive) | 125 | 127 | 13 | 13 
 array (union, explicit) | 117 | 131 | 15 | 15 

> Unit: Megabytes/sec







Total elapsed time: 365,934 ms
