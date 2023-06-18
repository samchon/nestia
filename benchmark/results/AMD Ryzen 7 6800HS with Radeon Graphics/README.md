# Benchmark of `nestia`
> - CPU: AMD Ryzen 7 6800HS with Radeon Graphics
> - Memory: 64,781 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v1.3.8


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 43 | 61 | 58 | 4.85 | 5.05 
 object (hierarchical) | 112 | 117 | 115 | 9.34 | 9.84 
 object (recursive) | 110 | 116 | 110 | 7.88 | 8.09 
 object (union, explicit) | 72 | 77 | 48 | 3.30 | 3.39 
 array (simple) | 113 | 109 | 109 | 7.55 | 7.92 
 array (hierarchical) | 112 | 122 | 113 | 6.69 | 6.80 
 array (recursive) | 122 | 115 | 112 | 7.22 | 7.34 
 array (union, explicit) | 133 | 123 | 84 | 6.96 | 6.86 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 54 | 74 | 73 | 9.10 | 10 
 object (hierarchical) | 142 | 196 | 160 | 18 | 19 
 object (recursive) | 151 | 198 | 90 | 16 | 17 
 object (union, explicit) | 113 | 126 | 68 | 7.28 | 7.48 
 array (simple) | 91 | 100 | 92 | 16 | 16 
 array (hierarchical) | 156 | 164 | 72 | 14 | 14 
 array (recursive) | 126 | 127 | 74 | 15 | 14 
 array (union, explicit) | 113 | 127 | 31 | 17 | 17 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 54 | 77 | 76 | 8.02 | 8.56 
 object (hierarchical) | 128 | 140 | 129 | 17 | 18 
 object (recursive) | 123 | 135 | 95 | 14 | 15 
 object (union, explicit) | 82 | 92 | 53 | 3.27 | 3.21 
 array (simple) | 91 | 108 | 105 | 7.92 | 8.07 
 array (hierarchical) | 125 | 133 | 85 | 6.30 | 6.47 
 array (recursive) | 121 | 125 | 108 | 13 | 13 
 array (union, explicit) | 124 | 130 | 45 | 6.50 | 6.48 

> Unit: Megabytes/sec







Total elapsed time: 1,382,889 ms
